# encoding: UTF-8

namespace :firefox do

    desc 'Assemble content and generate config files for Firefox Add-on'
    task :dev do

        # Prepare a blank Firefox Add-on project
        FileUtils.rm_rf 'build/firefox/'
        FileUtils.rm_rf 'build/firefox/gokosalvager.xpi'
        FileUtils.mkdir_p 'build/firefox/'
        Dir.chdir('build/firefox/') { sh 'cfx init' }

        # Read properties from common config and version files
        props = eval(File.open('config.rb') {|f| f.read })
        props[:version] = get_version

        # Build package description
        pkg_json = fill_template 'src/config/firefox/package.json.erb', props
        File.open('build/firefox/package.json', 'w') {|f| f.write pkg_json }

        # Build "main" script
        main_js = fill_template 'src/config/firefox/main.js.erb', props
        File.open('build/firefox/lib/main.js', 'w') {|f| f.write main_js }

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
    task :test => [:dev] do
        sh 'cfx -v run --pkgdir=build/firefox/ --binary-args \
            "-url https://play.goko.com/Dominion/gameClient.html \
            -jsconsole"'
    end

    desc 'Create the Firefox extension .xpi'
    task :build => [:dev] do
        Dir.chdir('build') { sh 'cfx xpi --pkgdir=firefox' }
    end
end