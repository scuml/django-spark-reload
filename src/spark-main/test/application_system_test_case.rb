require "test_helper"
require "capybara/cuprite"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :cuprite, screen_size: [ 1440, 900 ], options: { headless: "new" }

  include Hotwire::Spark::Engine.routes.url_helpers

  def visit(...)
    super.tap do
      wait_for_hotwire_spark
    end
  end

  private
    def wait_for_hotwire_spark
      assert_css "[data-hotwire-spark-ready]"
    end
end

Capybara.server = :puma, { Silent: true }
