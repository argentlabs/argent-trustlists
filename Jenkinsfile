pipeline {
  agent {
    dockerfile true
  }

  parameters {
    choice(name: 'WORKSPACE', choices: ['test', 'staging', 'prod'], description: 'Workspace stage')
    choice(name: 'TYPE', choices: ['plan', 'apply', 'skip'], description: 'Plan or Apply changes')
  }

  stages {
    stage('Execute Terraform') {
      steps {
        ansiColor('xterm') {
          script {
            sh "rm -rf infrastructure/.terraform/"
            sh "terraform -chdir=infrastructure init"
            sh "bash deploy.sh ${params.WORKSPACE} ${params.TYPE}"
          }
        }
      }
    }
  }
}
