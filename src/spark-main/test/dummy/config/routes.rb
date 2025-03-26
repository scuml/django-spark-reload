Rails.application.routes.draw do
  root to: "home#show"

  get "/redirected", to: redirect("/")
end
