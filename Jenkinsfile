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
          steps {
             echo 'Notify GitLab'
             updateGitlabCommitStatus name: 'build', state: 'pending'
             echo 'build step goes here'
             updateGitlabCommitStatus name: 'build', state: 'success'
          }
       }
       stage(test) {
           steps {
               echo 'Notify GitLab'
               updateGitlabCommitStatus name: 'test', state: 'pending'
               echo 'test step goes here'
               updateGitlabCommitStatus name: 'test', state: 'success'

           }
       }
       stage ('Deploy') {
         steps {
            sshCommand remote: remote, command: "mkdir ciao"
            }
         }
      }
 }
