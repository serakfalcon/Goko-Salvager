# encoding: UTF-8

namespace :safari do

    desc 'Assemble content and generate config files for Firefox Add-on'
    task :dev do

        # Prepare an empty directory to assemble the Safari extension in
        FileUtils.rm_rf 'build/safari/'
        FileUtils.rm_rf 'build/gokosalvager.safariextz'
        FileUtils.mkdir_p 'build/safari/'

        # Read properties from common config and version files
        props = eval(File.open('config.rb') {|f| f.read })
        props[:version] = get_version

        # Build package description
        info_plist = fill_template 'src/config/safari/Info.plist.erb', props
        File.open('build/safari/Info.plist', 'w') {|f| f.write info_plist }

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

    file 'gokosalvager.safariextz' => [:dev] do |t, args|
        create_and_sign 'build/safari', '~/.safari-certs',
                        'build/gokosalvager.safariextz'
    end

    desc 'Create a signed .safariextz for Safari.'
    task :build => ['gokosalvager.safariextz'] do
        puts 'gokosalvager.safariextz created'
    end

end

# Based on http://blog.streak.com/2013/01/how-to-build-safari-extension.html.
# Contains instructions on obtaining your Safari developer security files.
def create_and_sign(src_dir, cert_dir, target)

    # Required Apple Safari developer security files:
    # - cert.der, cert01, cert02, key.pem, size.txt
    cert_dir = File.expand_path('~/.safari-certs')
    size_file = File.join(cert_dir, 'size.txt')

    # Create the extension archive file
    sh "xar -czf #{target} --distribution #{src_dir}"

    # Generate and sign archive digest
    sh "xar --sign -f #{target} \
            --digestinfo-to-sign digest.dat \
            --sig-size #{File.read(size_file).strip} \
            --cert-loc #{cert_dir}/cert.der \
            --cert-loc #{cert_dir}/cert01 \
            --cert-loc #{cert_dir}/cert02"

    # Generate and inject signature file
    sh "openssl rsautl -sign -inkey #{cert_dir}/key.pem \
                -in digest.dat -out sig.dat"
    sh "xar --inject-sig sig.dat -f #{target}"

    # Clean up
    rm_f ['sig.dat', 'digest.dat']
    chmod 744, target

end
