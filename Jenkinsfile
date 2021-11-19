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
         agent {     docker   'maven:3-alpine'   }
            environment { 
               scannerHome = tool 'SonarQubeScanner'
            }
           steps {
               echo 'Notify GitLab'
               updateGitlabCommitStatus name: 'test', state: 'pending'
               withSonarQubeEnv('sonarqube aminsep') {
                  sh 'export PATH="$PATH:$JAVA_HOME/bin" && cd /home/joseph/Documents/TwittEarth/ && ${scannerHome}/bin/sonar-scanner'
               }

            timeout(time: 10, unit: 'MINUTES') {
               waitForQualityGate abortPipeline: true
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
