# encoding: UTF-8

# TODO - set up the builds with proper dependencies
namespace :build do

  desc 'Create a .xpi for Firefox'
  task :firefox do
    FileUtils.mkdir_p 'build/'
    FileUtils.cp_r 'firefox/', 'build/firefox/'
    FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/firefox/data/'

    insert_set_parser_into_main_script('build/firefox/data/logviewer.js')
    run_in_page_context('build/firefox/data/logviewer.js')

    FileUtils.rm 'build/firefox/data/Goko_Live_Log_Viewer.user.js'

    sh 'cd build/ && cfx xpi --pkgdir=firefox/'
    puts 'build/gokosalvager.xpi created'
  end

end
