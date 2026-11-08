
pipeline {

    // Jenkins can execute this pipeline on any available agent.
    agent any

    // Add timestamps and prevent simultaneous builds of this job.
    options {
        timestamps()
        disableConcurrentBuilds()
    }

    // Environment variables available to pipeline steps.
    environment {
        JAVA_HOME = '/usr/lib/jvm/java-17-openjdk-amd64'
        MAVEN_HOME = '/opt/apache-maven-3.9.9'

        PATH = '/opt/apache-maven-3.9.9/bin:/usr/lib/jvm/java-17-openjdk-amd64/bin:/usr/bin:/usr/local/bin:/bin'
    }

    stages {

        // STAGE 1: CHECKOUT
        stage('Git Checkout') {
            steps {
                echo 'Checking out SpringERP source code'

                checkout scm

                sh 'git rev-parse --short HEAD'
            }
        }

        // STAGE 2: VERIFY PROJECT
        stage('Verify Project Structure') {
            steps {
                sh 'test -f backend/pom.xml'
                sh 'test -f frontend/package.json'

                echo 'Backend and frontend project files found.'
            }
        }

        // STAGE 3: BACKEND CONFIGURATION
        stage('Prepare Maven Configuration') {
            steps {
                dir('backend') {
                    sh '''
                        if [ -f .mvn/maven.config ]; then
                            sed -i '/^-Djava.home=/d' .mvn/maven.config
                        fi
                    '''
                }
            }
        }

        // STAGE 4: BACKEND BUILD
        stage('Backend Build') {
            steps {
                dir('backend') {
                    sh 'java -version'
                    sh 'mvn -version'
                    sh 'mvn -B clean verify'
                }
            }
        }

        // STAGE 5: BACKEND TEST REPORTS
        stage('Publish Backend Test Results') {
            steps {
                junit(
                    testResults: 'backend/target/surefire-reports/*.xml',
                    allowEmptyResults: true
                )
            }
        }

        // STAGE 6: BACKEND ARTIFACT
        stage('Archive Backend Artifact') {
            steps {
                archiveArtifacts(
                    artifacts: 'backend/target/*.jar',
                    fingerprint: true
                )

                echo 'Backend JAR archived.'
            }
        }

        // STAGE 7: FRONTEND DEPENDENCIES
        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'node --version'
                    sh 'npm --version'
                    sh 'npm ci'
                }
            }
        }

        // STAGE 8: FRONTEND TESTS
        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    script {
                        int result = sh(
                            script: 'npm test > test-output.txt 2>&1',
                            returnStatus: true
                        )

                        def output = readFile('test-output.txt')
                        echo output

                        if (result == 0) {
                            echo 'Frontend tests passed.'
                        } else if (output.contains('No test files found')) {
                            echo 'WARNING: No frontend test files configured.'
                        } else {
                            error 'Frontend tests failed.'
                        }
                    }
                }
            }
        }

        // STAGE 9: FRONTEND CODE QUALITY
        stage('Code Quality Check') {
            steps {
                dir('frontend') {
                    script {
                        int result = sh(
                            script: 'npm run lint > lint-output.txt 2>&1',
                            returnStatus: true
                        )

                        def output = readFile('lint-output.txt')
                        echo output

                        if (result == 0) {
                            echo 'ESLint checks passed.'
                        } else if (output.contains("couldn't find a configuration file")) {
                            echo 'WARNING: ESLint configuration missing.'
                        } else {
                            error 'ESLint reported code quality errors.'
                        }
                    }
                }
            }
        }

        // STAGE 10: FRONTEND PRODUCTION BUILD
        stage('Frontend Production Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        // STAGE 11: FRONTEND ARTIFACT
        stage('Archive Frontend Artifact') {
            steps {
                archiveArtifacts(
                    artifacts: 'frontend/dist/**',
                    fingerprint: true
                )

                echo 'Frontend production files archived.'
            }
        }
    }

    // POST-BUILD ACTIONS
    post {

        success {
            echo 'SpringERP CI Pipeline completed successfully!'
        }

        failure {
            echo 'SpringERP CI Pipeline failed. Check the failed stage.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
