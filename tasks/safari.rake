# encoding: UTF-8

namespace :safari do

    desc 'Assemble content and generate config files for Firefox Add-on'
    task :assemble do

        # Prepare an empty directory to assemble the Safari extension in
        FileUtils.rm_rf 'build/safari/'
        FileUtils.mkdir_p 'build/safari/'
       
        # Build the config files from templates and the common config info
        write_from_template('src/config/safari/Info.plist.erb',
                            'config.rb',
                            'build/safari/Info.plist')
        
        # TODO: What, if anything, should get modified/put in Settings.plist?
        FileUtils.cp 'src/config/safari/Settings.plist', 'build/safari/'

        # Copy js, css, and png content
        # TODO: How to specify the Safari extension's icon?
        FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/safari/'
        FileUtils.cp_r Dir.glob('src/ext/*.css'), 'build/safari/'
        FileUtils.cp Dir.glob('src/img/*.png'), 'build/safari/'

        # Wrap JS scripts to be run in Goko's gameClient.html context
        Dir.glob('build/safari/data/*.js').each do |js_script|
            run_in_page_context(js_script)
        end

        puts 'Safari Extension assembled. Ready to build.'
    end

    file 'gokosalvager.safariextz' => [:assemble] do |t, args|
        create_and_sign
    end

    desc 'Create a signed .safariextz for Safari.'
    task :build => ['gokosalvager.safariextz'] do
        puts 'gokosalvager.safariextz created'
    end

end

# based on http://blog.streak.com/2013/01/how-to-build-safari-extension.html
def create_and_sign
    src = 'build/safari/'
    target = 'gokosalvager.safariextz'

    cert_dir = File.expand_path('~/.safari-certs')
    size_file = File.join(cert_dir, 'size.txt')

    sh "openssl dgst -sign #{cert_dir}/key.pem -binary < #{cert_dir}/key.pem | wc -c > #{size_file}"
    sh "xar -czf #{target} --distribution #{src}"

    # NOTE: I'm not at all sure I'm signing this correctly... I'm using my
    # "safari_extension.cer" in place of the #{cert_dir} and I don't have a
    # cert01 or cert02 file at all. Apple 
    
    # michaeljb's original sign command 
    #sh "xar --sign -f #{target} --digestinfo-to-sign digest.dat --sig-size #{File.read(size_file).strip} --cert-loc #{cert_dir}/cert.der --cert-loc #{cert_dir}/cert01 --cert-loc #{cert_dir}/cert02"
    
    # The variant that I can run (though I haven't tested the result)
    sh "xar --sign -f #{target} --digestinfo-to-sign digest.dat --sig-size #{File.read(size_file).strip} --cert-loc #{cert_dir}/cert.der"
    sh "openssl rsautl -sign -inkey #{cert_dir}/key.pem -in digest.dat -out sig.dat"
    sh "xar --inject-sig sig.dat -f #{target}"
    rm_f ['sig.dat', 'digest.dat']
    chmod 744, target

end
