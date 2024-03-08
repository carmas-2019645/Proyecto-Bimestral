import Invoice from './invoice.model.js'
import User from '../user/user.model.js'
import Product from '../product/product.model.js'
import PDFDocument from "pdfkit";
import fs from "fs";


export const getInvoices = async (req, res) => {
    try {
        const { invoiceIds } = req.params;

        // Obtener las facturas por los IDs proporcionados
        const invoices = await Invoice.find({ _id: { $in: invoiceIds } }).populate('items.productId').populate('userId');

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'No invoices found for the provided IDs.' });
        }

        // Crear un nuevo documento PDF
        const doc = new PDFDocument();

        // Escribir el contenido de las facturas en el PDF
        invoices.forEach((invoice, index) => {
            // Encabezado de la factura
            doc.text(`Factura #${invoice._id}`);
            doc.text(`Fecha de Creación: ${invoice.createdAt}`);
            doc.text(`Cliente: ${invoice.userId.name} ${invoice.userId.surname}`);
            doc.moveDown(); // Moverse hacia abajo para dejar espacio

            // Detalles de los productos (tabla)
            doc.text('Producto                | Descripción           | Cantidad | Precio Unitario | Total');
            doc.text('--------------------------------------------------------------------');
            invoice.items.forEach(item => {
                const totalPrice = item.quantity * item.price;
                doc.text(`${item.productId.name.padEnd(24)}| ${item.productId.description.padEnd(22)}| ${item.quantity.toString().padEnd(9)}| Q ${item.price.toFixed(2).padEnd(15)}| Q ${totalPrice.toFixed(2)}`);
            });
            doc.text('--------------------------------------------------------------------');

            // Total de la factura
            doc.text(`Total Factura: Q ${invoice.totalAmount.toFixed(2)}`);
            doc.moveDown(); 
            doc.text('Gracias por su compra. ¡Regrese pronto!', { align: 'center' });

        
            if (index < invoices.length - 1) {
                doc.addPage(); 
            }
        });

        // Finalizar el documento PDF
        doc.end();

        // Enviar el archivo PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=facturas_usuario.pdf');
        doc.pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obtaining invoices.' });
    }
};


export const updateInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { items } = req.body;

        // Verificar si items está presente y es un array
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Items must be provided in the request body as an array' });
        }

        // Obtiene la factura a actualizar
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Verifica si ya fue terminada
        if (invoice.completed) {
            return res.status(400).json({ message: 'The invoice has already been completed and cannot be updated' });
        }

        // Actualiza
        invoice.items = items;

        // Recalcula si le subo una compra
        invoice.totalAmount = items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        // Guarda
        await invoice.save();

        // Mensaje sastifactorio
        res.status(200).json({ message: 'Invoice updated successfully', invoice });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};