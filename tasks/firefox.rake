# encoding: UTF-8

namespace :firefox do

    desc 'Generate an empty Firefox Add-On project'
    task :initdir do
        FileUtils.rm_rf 'build/firefox/'
        FileUtils.mkdir_p 'build/firefox/'
        Dir.chdir('build/firefox/') { sh 'cfx init' }
    end

    desc 'Add config files and content scripts to the Firefox Add-on'
    task :assemble => [:initdir] do

        require 'erb'
        require 'ostruct'

        # Read Add-on configuration info from file
        # NOTE: The erb templates expect this variable to be named "config"
        config = eval(File.open('config.rb') {|f| f.read })

        # Generate package.json from template and config values
        template = File.read('src/config/firefox/package.json.erb')
        pkg = ERB.new(template).result(binding)
        File.open('build/firefox/package.json', "w") { |f| f.write pkg }

        # Generate main.js from template
        template = File.read('src/config/firefox/main.js.erb')
        pkg = ERB.new(template).result(binding)
        File.open('build/firefox/lib/main.js', "w") { |f| f.write pkg } 

        # Copy content files (JS, CSS, PNG)
        FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/firefox/data/'
        FileUtils.cp_r Dir.glob('src/ext/*.css'), 'build/firefox/data/'
        FileUtils.cp Dir.glob('src/img/*.png'), 'build/firefox/data/'

        # Wrap JS files so they run in Goko's gameClient.html context
        Dir.glob('build/firefox/data/*.js').each do |js_script|
            run_in_page_context(js_script)
        end

        puts 'Firefox Add-On is ready for building or testing.'
    end

    desc 'Test the Firefox extension'
    task :dev => [:assemble] do
        sh 'cfx -v run --pkgdir=build/firefox/ --binary-args \
            "-url https://play.goko.com/Dominion/gameClient.html \
            -jsconsole"'
    end

    desc 'Create the Firefox extension .xpi'
    task :build => [:assemble] do
        sh 'cfx -v xpi --pkgdir=build/firefox/'
    end
end
