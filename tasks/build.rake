# encoding: UTF-8

# TODO - set up the builds with proper dependencies
namespace :build do

  desc 'Create a .xpi for Firefox'
  task :firefox do
    FileUtils.mkdir_p 'build/'
    FileUtils.cp_r 'firefox/', 'build/'
    FileUtils.cp_r Dir.glob('src/dev/*.js'), 'build/firefox/data/'
    FileUtils.cp_r Dir.glob('src/ext/*.js'), 'build/firefox/data/'

    run_in_page_context('build/firefox/data/logviewerplus.js')
    run_in_page_context('build/firefox/data/set_parser.js')
    run_in_page_context('build/firefox/data/gokoHelpers.js')
    run_in_page_context('build/firefox/data/automatch.js')
    run_in_page_context('build/firefox/data/automatchSeekPop.js')
    run_in_page_context('build/firefox/data/automatchOfferPop.js')
    run_in_page_context('build/firefox/data/automatchGamePop.js')

    sh 'cd build/ && cfx xpi --pkgdir=firefox/'
    puts 'build/gokosalvager.xpi created'
  end

  desc 'Create a signed .safariextz for Safari'
  task :safari do
    FileUtils.mkdir_p 'build'
    FileUtils.mkdir_p 'gokosalvager.safariextension'
    FileUtils.cp_r Dir.glob('src/ext/*.js'), 'gokosalvager.safariextension/'

    insert_set_parser_into_main_script('gokosalvager.safariextension/Goko_Live_Log_Viewer.user.js')
    run_in_page_context('gokosalvager.safariextension/Goko_Live_Log_Viewer.user.js')

    FileUtils.cp [SAFARI_INFO, SAFARI_SETTINGS],  'gokosalvager.safariextension/'
    sh CREATE_AND_SIGN
    FileUtils.mv ['gokosalvager.safariextz', 'gokosalvager.safariextension'], 'build/'
    puts 'build/gokosalvager.safariextz created'
  end
end
