module FilesHelper
  extend ActiveSupport::Concern

  included do
    teardown do
      restore_original_files
      delete_added_files
    end
  end

  ORIGINAL_EXTENSION = ".original"

  def edit_file(path, replace:, with:)
    path = expand_path(path)

    raise ArgumentError, "File at '#{path}' does not exist." unless File.exist?(path)

    original_path = remember_original_path_to_restore path

    FileUtils.cp path, original_path

    content = File.read(path)
    updated_content = content.gsub(replace, with)
    File.write(path, updated_content)

    reload_rails_reloader
    sleep 2 # Broadcasting many jobs in a row sometimes makes the test fail
  end

  def add_file(path, content)
    path = expand_path(path)

    raise ArgumentError, "File at '#{path}' already exists." if File.exist?(path)

    remember_path_to_delete path
    File.write path, content

    reload_rails_reloader
  end

  def remove_file(path)
    path = expand_path(path)

    original_path = remember_original_path_to_restore path

    FileUtils.mv path, original_path
  end

  def replace_file(path, with:)
    path = expand_path(path)
    replacement = expand_path(with)

    original_path = remember_original_path_to_restore path
    FileUtils.cp path, original_path
    FileUtils.cp replacement, path
  end

  private
    def expand_path(path)
      Rails.application.root.join(path).to_s
    end

    def remember_original_path_to_restore(path)
      "#{path}#{ORIGINAL_EXTENSION}".tap do |original_path|
        remember_path_to_restore original_path
      end
    end

    def remember_path_to_restore(path)
      paths_to_restore << path
    end

    def paths_to_restore
      @paths_to_restore ||= []
    end

    def remember_path_to_delete(path)
      paths_to_delete << path
    end

    def paths_to_delete
      @paths_to_delete ||= []
    end

    def restore_original_files
      paths_to_restore.each do |path|
        FileUtils.cp(path, path.gsub(/#{ORIGINAL_EXTENSION}$/, ""))
        FileUtils.rm(path)
      end
    end

    def delete_added_files
      paths_to_delete.each do |path|
        FileUtils.rm(path)
      end
    end
end
