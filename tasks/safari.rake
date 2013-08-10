# encoding: UTF-8

namespace :safari do

  directory 'build/gokosalvager.safariextension'

  safari_src = Dir.glob('safari/*')

  # TODO: use the Dir class to do this file name stuff right
  automatch_script_names = Dir.glob('src/ext/automatch*.js').map { |f| f.gsub('src/ext/', '') } << 'gokoHelpers.js'
  automatch_build_scripts = automatch_script_names.map { |f| "build/gokosalvager.safariextension/#{f}" }

  automatch_script_names.each do |f|
    file "build/gokosalvager.safariextension/#{f}" => ['build/gokosalvager.safariextension', "src/ext/#{f}"] do |t|
      FileUtils.cp "src/ext/#{f}", t.name
    end
  end

  build_scripts = automatch_build_scripts << 'build/gokosalvager.safariextension/Goko_Live_Log_Viewer.user.js'

  file 'build/gokosalvager.safariextension/Goko_Live_Log_Viewer.user.js' => ['build/gokosalvager.safariextension', 'src/ext/Goko_Live_Log_Viewer.user.js', 'src/dev/set_parser.js', 'src/dev/runInPageContext.js'] do |t|
    sh "cat src/dev/set_parser.js src/ext/Goko_Live_Log_Viewer.user.js > #{t.name}"
    run_in_page_context(t.name)
  end

  ['Info.plist', 'Settings.plist'].each do |f|
    file "build/gokosalvager.safariextension/#{f}" => ['build/gokosalvager.safariextension', "safari/#{f}"] do |t|
      FileUtils.cp("safari/#{f}", t.name)
    end
  end

  desc 'Create a directory for Safari development'
  task dev: ['build/gokosalvager.safariextension/Info.plist', 'build/gokosalvager.safariextension/Settings.plist', build_scripts].flatten do
    puts 'Ready to develop with build/gokosalvager.safariextension'
  end

  file 'build/gokosalvager.safariextz' => ['safari:dev'] do |t, args|
    sh "src/dev/createAndSign.sh"
  end

  desc 'Create a signed .safariextz for Safari.'
  task :build => ['build/gokosalvager.safariextz'] do
    puts 'build/gokosalvager.safariextz created'
  end

end
