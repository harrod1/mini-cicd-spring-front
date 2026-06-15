pipeline {
    agent any

    environment {
        DOCKERHUB_AUTH = credentials('DockerHubCredentials')
        STAGING_HOST = '54.234.80.235'
        PROD_HOST = '100.52.252.225'

        BACKEND_IMAGE = 'mini-cicd-backend:latest'
        FRONTEND_IMAGE = 'mini-cicd-frontend:latest'
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
                    docker build -t "$DOCKERHUB_AUTH_USR/$BACKEND_IMAGE" ./backend
                    docker build -t "$DOCKERHUB_AUTH_USR/$FRONTEND_IMAGE" ./frontend
                '''
            }
        }

        stage('Push Docker Images') {
            steps {
                    sh '''
                        echo "$DOCKERHUB_AUTH_PSW" | docker login -u "$DOCKERHUB_AUTH_USR" --password-stdin
                        docker push "$DOCKERHUB_AUTH_USR/$FRONTEND_IMAGE"
                        docker push "$DOCKERHUB_AUTH_USR/$BACKEND_IMAGE"
                    '''
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
                sshagent(credentials: ['SSH_AUTH_SERVER']) {
                    sh '''
                         mkdir -p ~/.ssh
                         ssh-keyscan -H "$STAGING_HOST" >> ~/.ssh/known_hosts
                         ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook \
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
                sshagent(credentials: ['SSH_AUTH_SERVER']) {
                    sh '''
                        mkdir -p ~/.ssh
                        ssh-keyscan -H "$PROD_HOST" >> ~/.ssh/known_hosts
                        ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook \
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
