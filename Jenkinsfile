// Jenkinsfile: QA-API projesi için otomatik CI/CD pipeline
// DockerHub için credential ID: dockerhub-token
// Test raporu için: test-results/test-results.xml
// Deploy adımı eklemek istersen aşağıdaki şablonu kullanabilirsin.

pipeline {
  agent any

  environment {
    NODE_ENV = 'test'
    DOCKERHUB_USERNAME = credentials('dockerhub-username')
    DOCKERHUB_TOKEN = credentials('dockerhub-token')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Install Dependencies') {
      steps {
        sh 'npm install'
      }
    }
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
    stage('Test') {
      steps {
        sh 'npm test'
      }
    }
    stage('Docker Build & Push') {
      when {
        branch 'main'
      }
      steps {
        script {
          dockerImage = docker.build("${env.DOCKERHUB_USERNAME}/qa-api:${env.BUILD_NUMBER}")
        }
        sh 'echo $DOCKERHUB_TOKEN | docker login -u $DOCKERHUB_USERNAME --password-stdin'
        sh "docker push $DOCKERHUB_USERNAME/qa-api:${env.BUILD_NUMBER}"
      }
    }
    // Deploy adımı eklemek için örnek:
    // stage('Deploy') {
    //   steps {
    //     withCredentials([sshUserPrivateKey(credentialsId: 'deploy-key', keyFileVariable: 'SSH_KEY')]) {
    //       sh 'ssh -i $SSH_KEY user@your-server "docker pull $DOCKERHUB_USERNAME/qa-api:${env.BUILD_NUMBER} && docker restart ..."'
    //     }
    //   }
    // }
  }

  post {
    always {
      junit 'test-results/test-results.xml'
      cleanWs()
    }
  }
}
// NOT: Jenkins arayüzünde 'dockerhub-username' (username) ve 'dockerhub-token' (secret text) olarak iki ayrı credential oluşturmalısın. 