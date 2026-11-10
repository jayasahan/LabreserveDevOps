
pipeline {
    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    options {
        timestamps()
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
    }

    post {
        success {
            echo 'LabReserve CI pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the console output.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
