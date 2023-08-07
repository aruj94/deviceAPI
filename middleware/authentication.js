
const authentication = async (req, res, next) => {

    try {
        const apikey = req.headers.authorization;

        if (!apikey || apikey !== process.env.SECRET_API_KEY) {
            return res.status(401).json({ error: "Unauthorized: Invalid API key provided" });
        }

        next();

    } catch (error) {
        console.log(error);
    }
}

export default authentication;