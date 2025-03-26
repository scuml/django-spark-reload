require "application_system_test_case"

class YamlHtmlReloadTest < ApplicationSystemTestCase
  test "yaml changes reloads the page" do
    visit root_path

    assert_equal "Hello world", find("#translation").text

    edit_file "config/locales/en.yml", replace: "Hello world", with: "Hello spark"

    assert_equal "Hello spark", find("#translation").text
  end
end
