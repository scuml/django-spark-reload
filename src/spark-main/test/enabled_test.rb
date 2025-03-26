require "test_helper"

class EnabledTest < ActiveSupport::TestCase
  test "that Hotwire-Spark is only enabled when starting the Rails server" do
    script = <<~RUBY.strip
      Hotwire::Spark.enabled? ? exit(1) : exit(0)
    RUBY

    assert system({ "RAILS_ENV" => "development" }, "rails", "runner", script, chdir: Rails.application.root)
  end
end
