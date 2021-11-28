def remote = [:]
remote.name = "giuseppe.carrino2@annina.cs.unibo.it"
remote.host = "annina.cs.unibo.it"
remote.user = "giuseppe.carrino2"
remote.identityFile = "/var/lib/jenkins/.ssh/lab_ssh"
remote.allowAnyHosts = true

pipeline {
    agent any
    stages {
       stage('build') {
         when { changeset "*/**" }
          steps {
             echo 'Notify GitLab'
             updateGitlabCommitStatus name: 'build', state: 'pending'
             echo 'build step goes here'
             updateGitlabCommitStatus name: 'build', state: 'success'
          }
       }
       stage(test) {
         when { changeset "*/**" }
         environment {
            SCANNER_HOME = tool 'SonarQubeTwittEarth'
         }
          steps {
            withSonarQubeEnv(installationName: 'SonarQube', credentialsId: 'sonarqube_token_vero') {
                sh "echo ${SCANNER_HOME}"
                sh '''cd /home/joseph/Documents/new_twittEarth/sonar-scanner-4.6.2.2472-linux/bin &&\
                    sonar-scanner -D"sonar.projectKey=10_TwittEarth" \
                    -D"project.settings=../sonar-project.properties" \
                    -D"sonar.sources=." -D"sonar.host.url=https://aminsep.disi.unibo.it/sonarqube" \
                    -D"sonar.login=c98b50793a5bab155206a753ea0964ed9ab0a342"'''
            }
          }
       }
       stage ('Deploy') {
         when { changeset "*/**" }
         steps {
               sshCommand remote: remote, command: "cd ../../web/site202136/html && git pull origin master"
            }
         }
      }
 }
