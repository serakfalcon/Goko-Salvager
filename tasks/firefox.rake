# encoding: UTF-8

namespace :firefox do

  firefox_subdirs = ['data', 'doc', 'lib', 'test']
  firefox_subdirs.each do |d|
    directory "build/firefox/#{d}"
  end

  firefox_files = Dir.glob('firefox/**/*').reject { |f| firefox_subdirs.index(File.basename(f)) != nil }

  # TODO: use the Dir class to do this file name stuff right
  automatch_script_names = Dir.glob('src/ext/automatch*.js').map { |f| File.basename(f) } << 'gokoHelpers.js'
  automatch_build_scripts = automatch_script_names.map { |f| "build/firefox/data/#{f}" }

  automatch_script_names.each do |f|
    file "build/firefox/data/#{f}" => ['build/firefox', "src/ext/#{f}"] do |t|
      FileUtils.cp "src/ext/#{f}", t.name
    end
  end

  build_scripts = automatch_build_scripts << 'build/firefox/data/logviewer.js'

  file 'build/firefox/data/logviewer.js' => ['build/firefox', 'src/ext/Goko_Live_Log_Viewer.user.js', 'src/dev/set_parser.js', 'src/dev/runInPageContext.js'] do |t|
    sh "cat src/dev/set_parser.js src/ext/Goko_Live_Log_Viewer.user.js > #{t.name}"
    run_in_page_context(t.name)
  end

  firefox_files.each do |f|
    file "build/#{f}" => ["build/#{File.dirname(f)}", f] do |t|
      FileUtils.cp(f, t.name)
    end
  end

  desc 'Generate the build/firefox dir'
  task dev: [firefox_files.map { |f| "build/#{f}" }, build_scripts].flatten do
    puts 'build/firefox updated'
  end

  file 'build/gokosalvager.xpi' => ['firefox:dev'] do |t|
    sh 'cd build/ && cfx xpi --pkgdir=firefox/'
  end

  desc 'Create a .xpi for Firefox'
  task build: 'build/gokosalvager.xpi' do
    puts 'build/gokosalvager.xpi created'
  end

end
