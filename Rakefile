# encoding: UTF-8

require 'rake/clean'
require 'erb'
require 'ostruct'

CLEAN.include 'build/*/'
CLOBBER.include 'build'

WRAPPER = 'src/dev/runInPageContext.js'

def run_in_page_context(file)
  f = File.read(file)
  t = File.new(file, 'w')
  File.open(WRAPPER) do |w|
    w.each_line do |l|
      t.write(l.strip == '// insert file here' ? f : l)
    end
  end
  t.close
end


def fill_template(templatefile, property_hash)
    config = property_hash
    template = File.read(templatefile)
    return ERB.new(template).result(binding)
end

Dir.glob('tasks/*.rake').each { |r| import r }

desc 'Build and package extension for all supported browsers'
task :build, :forbetas do |task, args|
    Rake::Task['chrome:build'].invoke(args[:forbetas])
    Rake::Task['firefox:build'].invoke(args[:forbetas])
    Rake::Task['safari:build'].invoke(args[:forbetas])
end

desc 'Equivalent to "rake build"'
task :default => [:build]

