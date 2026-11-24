import Tareas from '../models/task.js';

export async function CrearTarea(req, res) {
    try {
        const { content, user_id, chat_id, estado } = req.body;
        if (!content || !user_id || !chat_id) {
            return res.status(400).json({ 
                message: "Uno o más datos no son válidos " 
            });
        }

        const crearTarea = await Tareas.create({ content, user_id, chat_id, estado });
        return res.status(200).json({
            message: "hola si funcionó",
            tarea: crearTarea
        });
    } catch (error) {
        res.status(500).json({ 
            message: error.message
        });
    }
}

export async function BorrarTarea(req, res) {
    try {
        const { tarea } = req.query;
        if (!tarea) {
            return res.status(400).json({ 
                message: "La tarea no es válida" 
            });
        }

        const borrarTarrea = await Tareas.destroy({ where: {id: tarea} });
        if (borrarTarrea === 1) {
            return res.status(200).json({
                message: "Se ha eliminado la tarea"
            });
        } else {
            return res.status(404).json({
                message: "No se encontró la tarea"
            });
        }
    } catch (error) {
        res.status(500).json({ 
            message: error.message
        });
    }
}

export async function CompletarTarea(req, res) {
    try {
        const { tarea } = req.query;
        if (!tarea) {
            return res.status(400).json({ 
                message: "La tarea no es válida" 
            });
        }

        const actualizarTarea = await Tareas.update({ estado: "completada" },{ where: {id: tarea} });
        if (actualizarTarea[0] === 1) {
            return res.status(200).json({
                message: "Se ha compeltado la tarea"
            });
        } else {
            return res.status(404).json({
                message: "No se encontró la tarea"
            });
        }
    } catch (error) {
        res.status(500).json({ 
            message: error.message
        });
    }
}

export async function ObtenerTaeras(req, res) {
    try {
        const { chat_id } = req.query;


        const obtenerTTareas = await Tareas.findAll({where: {chat_id}});
        return res.status(200).json({
            message: "hola si funcionó",
            tarea: obtenerTTareas
        });


    } catch (error) {
        res.status(500).json({ 
            message: error.message
        });
    }
}