# encoding: UTF-8

namespace :firefox do

    # Copy Firefox file heirarchy and config files into build
    FileUtils.mkdir_p 'build/'
    FileUtils.cp_r 'firefox/', 'build/'

    # Copy source files into build (both JS and CSS)
    FileUtils.cp_r Dir.glob('src/ext/*'), 'build/firefox/data/'

    # Wrap each JS script so than it run's in Goko's gameClient.html JS context
    Dir.glob('build/firefox/data/*.js').each do |js_script|
        run_in_page_context(js_script)
    end

    # Run the Firefox Add-On SDK builder
    sh 'cd build/ && cfx xpi --pkgdir=firefox/ && cd ..'

    desc 'Create a .xpi for Firefox'
    task build: ['build/gokosalvager.xpi'] do
      puts 'build/gokosalvager.zip created'
    end
end
