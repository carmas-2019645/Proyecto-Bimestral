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
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Obtener las facturas del usuario y su información relacionada
        const invoices = await Invoice.find({ userId }).populate('items.productId').populate('userId');

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'Este cliente no tiene facturas.' });
        }

        // Crear un nuevo documento PDF
        const doc = new PDFDocument();

        // Escribir el contenido de las facturas en el PDF
        invoices.forEach((invoice, index) => {
            // Encabezado de la factura
            doc.text(`Factura #${invoice._id}`);
            doc.text(`Fecha de Creación: ${invoice.createdAt}`);
            // Verificar si invoice.userId es null antes de intentar acceder a sus propiedades
            if (invoice.userId) {
                doc.text(`Cliente: ${invoice.userId.name} ${invoice.userId.surname}`);
            } else {
                doc.text('Cliente: Nombre del cliente no disponible');
            }
            doc.moveDown(); // Moverse hacia abajo para dejar espacio

            // Detalles de los productos (tabla)
            doc.moveDown();
            doc.text('Detalles de los productos:');
            doc.moveDown();

            // Escribir detalles de cada producto en una lista
            invoice.items.forEach((item) => {
                doc.text(`${item.productId.name}: ${item.quantity} x Q ${item.price.toFixed(2)} = Q ${(item.quantity * item.price).toFixed(2)}`);
            });

            // Total de la factura
            doc.text(`Total Factura: Q ${invoice.totalAmount.toFixed(2)}`);
            doc.moveDown(); // Moverse hacia abajo para dejar espacio
            doc.text('Gracias por su compra. ¡Regrese pronto!', { align: 'center' });

            // Agregar espacio entre facturas, excepto en la última
            if (index < invoices.length - 1) {
                doc.addPage(); // Añadir una nueva página para la siguiente factura
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
        res.status(500).json({ message: 'Error al obtener las facturas del usuario.' });
    }
};



export const getInvoices = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificar si el usuario existe
        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Obtener las facturas del usuario y su información relacionada
        const invoices = await Invoice.find({ userId }).populate('items.productId').populate('userId');

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'Este cliente no tiene facturas.' });
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
            doc.moveDown(); // Moverse hacia abajo para dejar espacio
            doc.text('Gracias por su compra. ¡Regrese pronto!', { align: 'center' });

            // Agregar espacio entre facturas, excepto en la última
            if (index < invoices.length - 1) {
                doc.addPage(); // Añadir una nueva página para la siguiente factura
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
        res.status(500).json({ message: 'Error al obtener las facturas del usuario.' });
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

        // Obtener la factura a actualizar
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Verificar si la factura ya ha sido completada
        if (invoice.completed) {
            return res.status(400).json({ message: 'The invoice has already been completed and cannot be updated' });
        }

        // Actualizar los elementos de la factura
        invoice.items = items;

        // Recalcular el totalAmount basado en los elementos actualizados
        invoice.totalAmount = items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        // Guardar la factura actualizada en la base de datos
        await invoice.save();

        // Devolver la factura actualizada al usuario
        res.status(200).json({ message: 'Invoice updated successfully', invoice });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};