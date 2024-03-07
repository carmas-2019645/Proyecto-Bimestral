import Invoice from './invoice.model.js'
import User from '../user/user.model.js'
import Product from '../product/product.model.js'
import PDFDocument from "pdfkit";
import fs from "fs";



export const getInvoicesByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificar si el usuario existe
        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Obtener las facturas del usuario y su información relacionada
        const invoices = await Invoice.find({ userId }).populate('items.productId').populate('userId');

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'This customer does not have invoices.' });
        }

        // Creamos un nuevo documento pdf
        const doc = new PDFDocument();

        // Aqui escribe en el pdf
        invoices.forEach((invoice, index) => {
            // Todo el encabezado de la factura
            doc.text(`Factura #${invoice._id}`);
            doc.text(`Fecha de Creación: ${invoice.createdAt}`);
            // Verificar si invoice.userId existe 
            if (invoice.userId) {
                doc.text(`Cliente: ${invoice.userId.name} ${invoice.userId.surname}`);
            } else {
                doc.text('Cliente: Nombre del cliente no disponible');
            }
            doc.moveDown(); 

            // Detalles de los product lo metimos dentro de una tabla
            doc.moveDown();
            doc.text('Detalles de los productos:');
            doc.moveDown();

            // Jala los detalles de los productos
            invoice.items.forEach((item) => {
                doc.text(`${item.productId.name}: ${item.quantity} x Q ${item.price.toFixed(2)} = Q ${(item.quantity * item.price).toFixed(2)}`);
            });

            // Total de la factura
            doc.text(`Total Factura: Q ${invoice.totalAmount.toFixed(2)}`);
            doc.moveDown(); 
            doc.text('Gracias por su compra. ¡Regrese pronto!', { align: 'center' });

            // Agregar espacio menos la ultima 
            if (index < invoices.length - 1) {
                doc.addPage() // si es muy grande la factura otra pagina.
            }
        });

        // Finalizar el documento PDF
        doc.end();

        // Aqui enviamos el archivo PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=facturas_usuario.pdf');
        doc.pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obtaining user invoices.' });
    }
};



export const getInvoices = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificar si el usuario existe
        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Obteniene las facturas y sus datos
        const invoices = await Invoice.find({ userId }).populate('items.productId').populate('userId');

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'This customer has no invoices.' });
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
        res.status(500).json({ message: 'Error obtaining user invoices.' });
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