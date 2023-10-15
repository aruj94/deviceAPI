pipeline {
    agent any

    stages {

        stage('Building Docker Image') {
            steps {
                script {
                    def imageName = 'deviceapi-image'
                    def tag = "localhook"

                    withCredentials([string(credentialsId: 'artifact-repo-url', variable: 'registryurl')]) {

                        // Build the Docker image using your Dockerfile.dev
                        bat "docker build -f Dockerfile.dev -t ${imageName}:${tag} ."

                        // Create tag
                        bat "docker tag ${imageName}:${tag} ${registryurl}/${imageName}:${tag}"
                    }
                }
            }
        }

        stage('Push Docker Image to Artifact Registry') {
            steps {
                script {
                    def imageName = 'deviceapi-image'
                    def tag = "localhook"

                    withCredentials([string(credentialsId: 'artifact-repo-url', variable: 'registryurl')]) {
                        // Push the image to Artifact registry if needed
                        bat "docker push ${registryurl}/${imageName}:${tag}"
                    }
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
