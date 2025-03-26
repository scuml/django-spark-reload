require_relative "lib/hotwire/spark/version"

Gem::Specification.new do |spec|
  spec.name        = "hotwire-spark"
  spec.version     = Hotwire::Spark::VERSION
  spec.authors     = [ "Jorge Manrubia" ]
  spec.email       = [ "jorge@37signals.com" ]
  spec.homepage    = "https://github.com/hotwired/spark"
  spec.summary     = "Smooth live reloading for your Rails apps"
  spec.description = "A live reloading system that updates just what's needed to offer a smooth experience."
  spec.license     = "MIT"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/hotwired/spark"
  spec.metadata["changelog_uri"] = "https://github.com/hotwired/spark"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  spec.add_dependency "rails", ">= 7.0.0"
  spec.add_dependency "zeitwerk"
  spec.add_dependency "listen"

  spec.add_development_dependency "rubocop"
  spec.add_development_dependency "rubocop-rails-omakase"
  spec.add_development_dependency "capybara"
  spec.add_development_dependency "cuprite"
end
