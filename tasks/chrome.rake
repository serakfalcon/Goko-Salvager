# encoding: UTF-8

namespace :chrome do

    desc 'Assemble content and generate config files for Chrome extension'
    task :assemble do

        # Prepare a blank Firefox Add-on project
        FileUtils.rm_rf 'build/chrome/'
        FileUtils.mkdir_p 'build/chrome/images'

        # Build package description from common config
        write_from_template('src/config/chrome/manifest.json.erb',
                            'config.rb',
                            'build/chrome/manifest.json')

        # Copy js, css, and png files
        FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/chrome/'
        FileUtils.cp_r Dir.glob('src/ext/*.css'), 'build/chrome/'
        FileUtils.cp Dir.glob('src/img/*.png'), 'build/chrome/images/'

        # Wrap JS scripts to be run in Goko's gameClient.html context
        Dir.glob('build/chrome/*.js').each do |js_script|
            run_in_page_context(js_script)
        end
    end

    desc 'Use build/chrome/ as "unpacked extension" for developing on Chrome'
    task :dev => [:assemble] do
        puts 'ready to use build/chrome/ as unpacked extension'
    end

    file 'build/gokosalvager-chrome.zip' => ['chrome:dev'] do |t|
        FileUtils.rm_rf 'build/gokosalvager-chrome.zip'
        Dir.chdir('build') { sh 'zip -r ../gokosalvager-chrome.zip chrome' }
    end

    desc 'Create a .zip for Chrome'
    task :build => ['build/gokosalvager-chrome.zip'] do
      puts 'build/gokosalvager-chrome.zip created'
    end

end
