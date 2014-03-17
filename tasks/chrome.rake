# encoding: UTF-8

namespace :chrome do

    task :build => ['chrome:zip', 'chrome:crx']

    desc 'Assemble content and generate config files for Chrome extension'
    task :assemble, :store do |task, args|
        # Read properties from common config file
        props = eval(File.open('config.rb') {|f| f.read })

        # Chrome store builds cannot contain an update_url tag
        if args[:store] != 'store' then
            server = 'https://%s:%s' % [props[:hostServer], props[:hostPort]]
            dir = '%s%s' % [props[:hostURLBase], props[:extupdate][:chrome]]
            props[:chrome_update_tag] = '"update_url": "%s%s",' % [server, dir]
        end

        # Prepare a blank Chrome Extension project
        FileUtils.rm_rf 'build/chrome/'
        FileUtils.rm_rf 'build/chrome/gokosalvager.zip'
        FileUtils.mkdir_p 'build/chrome/images'

        # Build package description
        man_json = fill_template 'src/config/chrome/manifest.json.erb', props
        File.open('build/chrome/manifest.json', 'w') {|f| f.write man_json }

        # Build script loader
        man_json = fill_template 'src/config/chrome/loadAll.js.erb', props
        File.open('build/chrome/loadAll.js', 'w') {|f| f.write man_json }

        # Copy js, css, and png files
        FileUtils.cp_r Dir.glob('src/lib/*.js'), 'build/chrome/'
        FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/chrome/'
        FileUtils.cp_r Dir.glob('src/ext/*.css'), 'build/chrome/'
        FileUtils.cp Dir.glob('src/img/*.png'), 'build/chrome/images/'

        # Insert build version and copy init script
        init_json = fill_template 'src/ext/init.js.erb', props
        File.open('build/chrome/init.js', 'w') {|f| f.write init_json }

        puts 'Assembled Chrome extension files. Ready to use as ' + 
             '"unpacked extension."'
    end

    desc 'Create a store-deployable .zip for Chrome'
    task :zip do
        # Must manually invoke to force 'assemble' to run again with "store"
        # argument even if it has already been run before without it.  Naming
        # it as a dependency does not suffice.
        Rake::Task["chrome:assemble"].invoke('store')
        FileUtils.rm_rf 'build/gokosalvager.zip'
        Dir.chdir('build/chrome') { sh 'zip -qr ../gokosalvager.zip *' }
        puts 'Created .zip, for deploying in Chrome Store.'
        puts
    end

    desc 'Create a signed .crx for Chrome'
    task :crx do
        # Must manually execute.  See comment on :zip task above.
        Rake::Task["chrome:assemble"].execute
        sh './crxmake.sh build/chrome ~/.private/chrome_key.pem'
        FileUtils.mv 'chrome.crx', 'build/gokosalvager.crx'
        puts 'Created signed .crx, for manual installation.'
        puts
    end
end
