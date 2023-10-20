pipeline {
    agent any

    environment {
        imageName = 'deviceapi-image'
        tag = 'jenkins'
        location = 'us-west1'
        cluster_name = 'deviceapi-jenkinspipeline-cluster'
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
                        def clusterExists = bat(script: "gcloud container clusters describe ${cluster_name} --location=${location} --project=${PROJECT_ID}", returnStatus: true)
                        if (clusterExists != 0) {
                            // Cluster does not exist, so create a auto-cluster
                            bat "gcloud container clusters create-auto ${cluster_name} --location=${location} --project=${PROJECT_ID}"
                        } else {
                            echo "Cluster ${cluster_name} already exists. Skipping cluster creation."
                        }
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

                    withCredentials([file(credentialsId: 'devapi-secrets', variable: 'secretFile')]) {
                        // Copy the secret file to the workspace
                        bat "copy ${secretFile} devapi-secrets.yaml"

                        // deploy secrets yaml file to kubernetes cluster
                        bat "kubectl create secret generic devapi-secrets --from-file=${secretFile}"

                        // Delete secret file from workspace
                        bat "delete devapi-secrets.yaml"
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
