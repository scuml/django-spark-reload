class Hotwire::Spark::Channel < ActionCable::Channel::Base
  def subscribed
    stream_from "hotwire_spark"
  end
end
