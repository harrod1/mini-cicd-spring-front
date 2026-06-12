pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = 'harrod'
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/mini-cicd-backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/mini-cicd-frontend:latest"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test Backend') {
            agent {
                docker {
                    image 'maven:3.9.9-eclipse-temurin-17'
                    args '-v /root/.m2:/root/.m2'
                    reuseNode true
                }
            }
            steps {
                sh '''
                    cd backend
                    mvn clean test
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    docker build -t ${BACKEND_IMAGE} ./backend
                    docker build -t ${FRONTEND_IMAGE} ./frontend
                '''
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_PASS'
                )]) {
                    sh '''
                        echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}
                    '''
                }
            }
        }

        stage('Deploy Staging') {
            agent {
                dockerfile {
                    filename 'agent/Dockerfile.ansible'
                    args '-u root'
                    reuseNode true
                }
            }
            steps {
                sshagent(credentials: ['aws-deploy-key']) {
                    sh '''
                        ansible-playbook \
                          -i ansible/hosts.yml \
                          ansible/deploy.yml \
                          --extra-vars "target=staging"
                    '''
                }
            }
        }

        stage('Validate Staging') {
            steps {
                sh '''
                    echo "Validation staging à compléter avec curl si besoin"
                '''
            }
        }

        stage('Manual Approval for Production') {
            steps {
                input message: 'Déployer en production ?', ok: 'Déployer'
            }
        }

        stage('Deploy Prod') {
            agent {
                dockerfile {
                    filename 'agent/Dockerfile.ansible'
                    args '-u root'
                    reuseNode true
                }
            }
            
            steps {
                sshagent(credentials: ['aws-deploy-key']) {
                    sh '''
                        ansible-playbook \
                          -i ansible/hosts.yml \
                          ansible/deploy.yml \
                          --extra-vars "target=prod"
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
    }
}
