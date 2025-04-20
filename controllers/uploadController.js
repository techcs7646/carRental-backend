exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        // Create URL for the uploaded image
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        res.json({ url: imageUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};