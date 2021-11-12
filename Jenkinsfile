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
               sshagent(credentials : ['3c95ddf2-40c7-4c59-b94c-55a7d981aacd']) {
               sh 'ssh -o StrictHostKeyChecking=no giuseppe.carrino2@annina.cs.unibo.it'
               sh 'ssh -v giuseppe.carrino2@annina.cs.unibo.it'
               sh 'mkdir ciao'
            }
         }
      }

    }
 }
