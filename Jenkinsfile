pipeline {
    agent any

    stages {

        stage('Building Docker Image') {
            steps {
                script {
                    def imageName = 'docker-image'
                    def tag = "localhook"

                    // Build the Docker image using your Dockerfile.dev
                    bat "docker build -f Dockerfile.dev -t ${imageName}:${tag} ."

                    // Create tag
                    bat "docker tag ${imageName}:${tag} us-west2-docker.pkg.dev/deviceapi-400721/deviceapi-docker-repo/${imageName}:${tag}"

                    // Push the image to Artifact registry if needed
                    bat "docker push us-west2-docker.pkg.dev/deviceapi-400721/deviceapi-docker-repo/${imageName}:${tag}"
                }
            }
        }

        // Add more stages for testing, deploying, etc.
    }

    post {
        success {
            echo 'Pipeline succeeded. You can add deployment steps here.'
        }
    }
}
