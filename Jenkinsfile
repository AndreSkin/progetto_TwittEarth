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
            steps{
               sshagent(credentials : ['ssh-lab']) {
               sh 'ssh -o StrictHostKeyChecking=no giuseppe.carrino2@annina.cs.unibo.it'
               sh 'ssh -v giuseppe.carrino2@annina.cs.unibo.it'
               sh 'mkdir ciao'
            }
         }
      }

    }
 }
