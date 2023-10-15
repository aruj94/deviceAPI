pipeline {
    agent any

    stages {

        stage('Building Docker Image') {
            steps {
                script {
                    def registryURL = credentials('artifact-repo-url')
                    def imageName = 'deviceapi-image'
                    def tag = "localhook"

                    echo "${registryURL.secretText}"

                    // Build the Docker image using your Dockerfile.dev
                    bat "docker build -f Dockerfile.dev -t ${imageName}:${tag} ."

                    // Create tag
                    bat "docker tag ${imageName}:${tag} ${registryURL.secretText}/${imageName}:${tag}"
                }
            }
        }

        stage('Push Docker Image to Artifact Registry') {
            steps {
                script {
                    def registryURL = credentials('artifact-repo-url')
                    def imageName = 'deviceapi-image'
                    def tag = "localhook"

                    // Push the image to Artifact registry if needed
                    bat "docker push ${registryURL.secretText}/${imageName}:${tag}"
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
