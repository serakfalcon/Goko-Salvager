# encoding: UTF-8

# Increment a number of the form 'X.Y' or 'X.Y.Z' by 0.0.1
def increment_version(version)
    version_parts = version.split('.').map { |n| n.to_i }
    if version_parts.length == 2
        version_parts[2] = 0
    end
    version_parts[2] += 1
    return version_parts.join('.')
end

task :version do |t, args|
    version = get_version
    version = increment_version version
    File.open(VERSION, 'w') { |f| f.puts version }
    puts "New verion number: #{version}"
end
