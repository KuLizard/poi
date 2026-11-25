import Lugar from '../models/place.js';


export async function RegistrarEnlaGuia(req, res) {

    try {

        const { nombre, category,  location,  service } = req.body;
        if ( !nombre || !location || !service) {
            return res.status(400).json({ 
                message: "Uno o más datos no son válidos " 
            });
        }

        const crearLugar = await Lugar.create({nombre, category, location, service});
        return res.status(200).json({
            message: "hola si funcionó",
            lugar: crearLugar
        });

    } catch (error) {
        res.status(500).json({ 
            message: error.message
        });
    }
}

export async function EliminardelaGuia(req, res) {

    try {

        const { registro } = req.query;
        if ( !registro) {
            return res.status(400).json({ 
                message: "El registro no es válido" 
            });
        }

        const borrarRegistro = await Lugar.destroy({ where: {id: registro} });
        if (borrarRegistro === 1) {
            return res.status(200).json({
                message: "Se ha eliminado el registro "
            });
        } else {
            return res.status(404).json({
                message: "No se encontró el registro"
            });
        }
    } catch (error) {
        res.status(500).json({ 
            message: error.message
        });
    }
}

export async function ObtenerLugaresParalaGuia(req, res) {

    try {
        const obtencionesLuagres = await Lugar.findAll();

        return res.status(200).json({
            message: "hola si funcionó",
            lugares: obtencionesLuagres
        });

    } catch (error) {
        res.status(500).json({ 
            message: error.message
        });
    }
}