# teslamegapack

This is a dummy API for testing GET, POST and DELETE functionalities. This API uses Node js, Express and MongoDb to carry out its functions.

You will need an API key to work with this otherwise the middleware authentication will fail.
The API uses mongodb Atlas cluster for storing, deleting and getting data from.

To send any request to the API you will need to send in the API key in the headers of your request. Otherwise neither of the post, delete or get functions will work.

A couple of tests have been setup to test routes and middleware operations.