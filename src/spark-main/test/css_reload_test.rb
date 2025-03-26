require "application_system_test_case"

class CssReloadTest < ApplicationSystemTestCase
  setup do
    visit root_path
  end

  test "reload CSS changes" do
    assert_text "This is pretty cool"

    edit_file "app/assets/stylesheets/base.css", replace: "visible", with: "hidden"

    assert_no_text "This is pretty cool"
  end

  test "load new CSS stylesheets" do
    assert_text "This is pretty cool"

    add_file "app/assets/stylesheets/other_stylesheet.css", <<~CSS
      body { visibility: hidden!important; }
    CSS

    assert_no_text "This is pretty cool"
  end
end
