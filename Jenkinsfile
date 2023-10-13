pipeline {
    agent any

    stages {

        stage('Debugging') {
            steps {
                script {
                    echo "Current directory: ${pwd()}"
                    sh "ls -l"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def imageName = 'docker-image'
                    def tag = "localhook"

                    // Build the Docker image using your Dockerfile.dev
                    sh "docker build -f Dockerfile.dev -t ${imageName}:${tag} ."

                    // Push the image to Artifact registry if needed
                    // sh "docker push ${imageName}:${tag}"
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
