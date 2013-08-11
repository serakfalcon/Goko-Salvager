# encoding: UTF-8

namespace :firefox do

    desc 'Assemble content and generate config files for Firefox Add-on'
    task :assemble do

        # Prepare a blank Firefox Add-on project
        FileUtils.rm_rf 'build/firefox/'
        FileUtils.mkdir_p 'build/firefox/'
        Dir.chdir('build/firefox/') { sh 'cfx init' }

        # Build package description from common config
        write_from_template('src/config/firefox/package.json.erb',
                            'config.rb',
                            'build/firefox/package.json')

        # Build "main" script from common config
        write_from_template('src/config/firefox/main.js.erb',
                            'config.rb',
                            'build/firefox/lib/main.js')

        # Copy js, css, and png files
        FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/firefox/data/'
        FileUtils.cp_r Dir.glob('src/ext/*.css'), 'build/firefox/data/'
        FileUtils.cp Dir.glob('src/img/*.png'), 'build/firefox/data/'

        # Wrap JS scripts to be run in Goko's gameClient.html context
        Dir.glob('build/firefox/data/*.js').each do |js_script|
            run_in_page_context(js_script)
        end

        puts 'Firefox Add-On is ready to test/build'
    end

    desc 'Test the Firefox extension'
    task :test => [:assemble] do
        sh 'cfx -v run --pkgdir=build/firefox/ --binary-args \
            "-url https://play.goko.com/Dominion/gameClient.html \
            -jsconsole"'
    end

    desc 'Create the Firefox extension .xpi'
    task :build => [:assemble] do
        sh 'cfx -v xpi --pkgdir=build/firefox/'
    end
end
