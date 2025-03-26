require "application_system_test_case"

class ImageHtmlReloadTest < ApplicationSystemTestCase
  test "image changes reloads the page" do
    visit root_path

    old_image_src = find("#image")["src"]
    replace_file "app/assets/images/green_rectangle.png", with: "app/assets/images/red_rectangle.png"

    assert_select "image[src='#{old_image_src}']", count: 0
  end
end
