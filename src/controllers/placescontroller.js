import Lugar from '../models/place.js';

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