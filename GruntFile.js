module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-bower-task');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		bower: {
			install: {
			
			}
		},
        connect: {
            server: {
                options: {
                    port: 8080,
                    base: './'
                }
            }
        },
        typescript: {
            src: {
                src: ['src/FirstOrderPredicateLogic.ts'],
                dest: 'dist/FirstOrderPredicateLogic.js',
                options: {
                    sourceMap: true,
                    declaration: true
                }
            },
            example: {
                src: ["dist/FirstOrderPredicateLogic.d.ts", 'examples/*.ts'],
                options: {
                    sourceMap: true,
                    module: "amd"
                }
            }
        },
        watch: {
            src: {
                files: 'src/**/*.ts',
                tasks: ['typescript:src']
            },
            exampleTymlToHtml: {
                files: 'examples/***.ts',
                tasks: ['typescript:example']
            }
        }
    });
 
    grunt.registerTask('dev', ["bower", "typescript", 'connect', 'watch']);


    grunt.registerTask('default', ["bower", "typescript"]);
}