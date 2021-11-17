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
            git branch: 'master',
                credentialsId: '289641b9-6f7c-45a7-bc87-cade54ff26aa',
                url: 'https://aminsep.disi.unibo.it/gitlab/UmbertoCarlucci/progetto-swe-team-10.git'
            
            withCredentials([gitUsernamePassword(credentialsId: '3c95ddf2-40c7-4c59-b94c-55a7d981aacd', gitToolName: 'git-tool')]){
               sshCommand remote: remote, command: "cd ../../web/site202136/html && git pull origin master"
               }
            }
         }
      }
 }
