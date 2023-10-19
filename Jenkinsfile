pipeline {
    agent any

    environment {
        imageName = 'deviceapi-image'
        tag = 'localhook'
        location = 'us-west1'
        cluster_name = 'deviceapi-pipeline-cluster'
        workload = 'devapi'
    }

    stages {
        stage('Building Docker Image') {
            steps {
                script {
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
                    withCredentials([string(credentialsId: 'artifact-repo-url', variable: 'registryurl')]) {
                        // Push the image to Artifact registry if needed
                        bat "docker push ${registryurl}/${imageName}:${tag}"
                    }
                }
            }
        }

        stage('Create a GKE auto-cluster') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'gcp_project_id', variable: 'PROJECT_ID')]) {
                        // Create a auto-cluster
                        bat "gcloud container clusters create-auto ${cluster_name} --location=${location} --project=${PROJECT_ID}"
                    }
                }
            }
        }

        stage ('connect to cluster and deploy kubernetes secrets') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'gcp_project_id', variable: 'PROJECT_ID')]) {
                        // Connect to GKE kubernetes cluster
                        bat "gcloud container clusters get-credentials ${cluster_name} --location=${location} --project=${PROJECT_ID}"
                    }

                    withCredentials([string(credentialsId: 'devapi-secrets', variable: 'SECRET_FILE')]) {
                        // deploy secrets yaml file to kubernetes cluster
                        bat "kubectl apply -f ${SECRET_FILE}"
                    }
                }
                
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded. You can add deployment steps here.'
        }
    }
}
