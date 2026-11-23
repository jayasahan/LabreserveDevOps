

pipeline {
    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out LabReserve source code'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci --prefix server'
                sh 'npm ci --prefix client'
            }
        }

        stage('Backend Syntax Check') {
            steps {
                sh '''
                    find server -type f -name '*.js' \
                    -not -path 'server/node_modules/*' \
                    -print0 | xargs -0 -n1 node --check
                '''
            }
        }

        stage('Backend Tests') {
            steps {
                dir('server') {
                    sh 'npm test'
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir('client') {
                    sh 'npm test'
                }
            }
        }

        stage('Frontend Production Build') {
            steps {
                dir('client') {
                    sh 'npm run build'
                }
            }
        }

        stage('Build and Push Docker Images') {
            steps {
                script {
                    def imageTag = sh(
                        script: 'git rev-parse --short=7 HEAD',
                        returnStdout: true
                    ).trim()

                    echo "Building images for commit: ${imageTag}"

                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub-creds',
                            usernameVariable: 'DOCKERHUB_USER',
                            passwordVariable: 'DOCKERHUB_TOKEN'
                        )
                    ]) {
                        sh """
                            set -eu

                            echo "\$DOCKERHUB_TOKEN" | docker login \
                                --username "\$DOCKERHUB_USER" \
                                --password-stdin

                            trap 'docker logout >/dev/null 2>&1 || true' EXIT

                            echo "Building backend image..."

                            docker build \
                                -t "\$DOCKERHUB_USER/labreserve-backend:${imageTag}" \
                                -t "\$DOCKERHUB_USER/labreserve-backend:latest" \
                                -f Dockerfile .

                            echo "Building frontend image..."

                            docker build \
                                -t "\$DOCKERHUB_USER/labreserve-frontend:${imageTag}" \
                                -t "\$DOCKERHUB_USER/labreserve-frontend:latest" \
                                -f client/Dockerfile ./client

                            echo "Pushing backend images..."

                            docker push "\$DOCKERHUB_USER/labreserve-backend:${imageTag}"
                            docker push "\$DOCKERHUB_USER/labreserve-backend:latest"

                            echo "Pushing frontend images..."

                            docker push "\$DOCKERHUB_USER/labreserve-frontend:${imageTag}"
                            docker push "\$DOCKERHUB_USER/labreserve-frontend:latest"

                            echo "Both images successfully pushed!"
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'LabReserve CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the console output.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
