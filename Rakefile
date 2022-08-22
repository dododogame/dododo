require 'rake'
require 'find'
require 'fileutils'
require 'open-uri'
require 'liquid'
require 'zip'
require 'rubygems/package'
require 'front_matter_parser'

module DododoBuilder
	DEFAULT_PLATFORM = case
	                   when /mswin|msys|mingw|cygwin|bccwin|wince|emc/ =~ RUBY_PLATFORM
		                   'win'
	                   when /darwin/ =~ RUBY_PLATFORM
		                   'osx'
	                   when /linux/ =~ RUBY_PLATFORM
		                   'linux'
	                   else
		                   RUBY_PLATFORM
	                   end
	
	DEFAULT_ARCHITECTURE = case
	                   when /x86_64|x86-64|x64|amd64|x86_64-linux-gnu/ =~ RUBY_PLATFORM
		                   'x64'
	                   else
		                   'ia32'
	                   end

	EXCLUDED = (File.readlines('.gitignore', chomp: true) + %w[
		.git
		.gitignore
		.gitmodules
		LICENSE
		README.md
		Rakefile
		Gemfile
		Gemfile.lock
	]).map { |path| File.expand_path path }

	DEFAULT_TARGET_PATH = 'pkg'

	JSDELIVR_FILES = %w[
		/gh/UlyssesZh/rmmv_materials@master/fonts/mplus-1m-regular.ttf
		/npm/eol@0.9.1/eol.min.js
		/npm/mathjs@10.5.2/lib/browser/math.min.js
		/npm/sprintf-js@1.1.2/src/sprintf.min.js
	]

	AUDIO_ASSETS = %w[
		hit_sounds/agogo_bells.ogg
		hit_sounds/bass_drum.ogg
		hit_sounds/bell_tree.ogg
		hit_sounds/cabasa.ogg
		hit_sounds/castanets.ogg
		hit_sounds/chinese_cymbal.ogg
		hit_sounds/chinese_hand_cymbals_1.ogg
		hit_sounds/chinese_hand_cymbals_2.ogg
		hit_sounds/clash_cymbals.ogg
		hit_sounds/cowbell_1.ogg
		hit_sounds/cowbell_2.ogg
		hit_sounds/djembe.ogg
		hit_sounds/djundjun.ogg
		hit_sounds/sheeps_toenails.ogg
		hit_sounds/sleigh_bells.ogg
		hit_sounds/snare_drum_1.ogg
		hit_sounds/snare_drum_2.ogg
		hit_sounds/spring_coil.ogg
		hit_sounds/surdo_1.ogg
		hit_sounds/surdo_2.ogg
		hit_sounds/tambourine_1.ogg
		hit_sounds/tambourine_2.ogg
		hit_sounds/whip.ogg
		hit_sounds/woodblock.ogg
		offset_wizard.ogg
	]

	DEFAULT_NWJS_VERSION = '0.67.1'

	module_function

	def copy_files source_path, target_path, excluded = []
		Find.find source_path do |source|
			next Find.prune if excluded.include? source
			target = source.sub /^#{source_path}/, target_path
			if File.directory? source
				FileUtils.mkdir_p target unless File.directory? target
			else
				FileUtils.copy source, target
			end
		end
	end

	def init
		@platform = ENV['platform'] || DEFAULT_PLATFORM
		@architecture = ENV['architecture'] || DEFAULT_ARCHITECTURE
		@quiet = ENV['quiet'] || false
		@target_path = File.expand_path ENV['target_path'] || File.join(DEFAULT_TARGET_PATH, "#{@platform}-#{@architecture}")
		@temp_dir = File.expand_path ENV['temp_dir'] || '~/.cache/dododo'
		@nwjs_version = ENV['nwjs_version'] || DEFAULT_NWJS_VERSION
		@nwjs_path = ENV['nwjs_path'] || File.join(@temp_dir, nwjs_filename)
		@www_home = File.join @target_path, 'www'
		@www_only = ENV['www_only'] == 'true'
		@package = ENV['package'] == 'true'
	end
	
	def nwjs_filename
		"#{nwjs_basename}.#{@platform == 'linux' ? 'tar.gz' : 'zip'}"
	end

	def nwjs_basename
		"nwjs-v#@nwjs_version-#@platform-#@architecture"
	end

	def log message
		puts '=> ' + message unless @quiet
	end

	def logi message
		puts message unless @quiet
	end

	def download_remote local_basedir, remote_basedir, path
		local_path = File.join @www_home, local_basedir, path
		remote_path = File.join remote_basedir, path
		download_file local_path, remote_path
	end

	def download_file local_path, remote_path
		logi "Downloading #{remote_path} to #{local_path}"
		unless File.directory? dirname = File.dirname(local_path)
			FileUtils.mkdir_p dirname
		end
		open local_path, 'wb' do |local_file|
			URI.open remote_path do |remote_file|
				local_file << remote_file.read
			end
		end
	end

	def extract file_path, target_path
		FileUtils.mkdir_p target_path
		if file_path.end_with? '.tar.gz'
			gem_package = Gem::Package.new ""
			open file_path do |f|
				gem_package.extract_tar_gz f, target_path
			end
		elsif file_path.end_with? '.zip'
			Zip::File.open file_path do |zip_file|
				zip_file.each do |entry|
					target = File.join target_path, entry.name
					FileUtils.mkdir_p File.dirname target
					zip_file.extract entry, target
				end
			end
		else
			raise "Unknown file type #{File.extname file_path}"
		end
	end

	def populate_www_home
		log "Copying files to #@www_home"
		copy_files __dir__, @www_home, EXCLUDED + [@www_home]

		log "Applying Liquid template to index.html"
		layout_string = URI.open 'https://raw.githubusercontent.com/dododogame/dododogame.github.io/development/_layouts/rpg.html', &:read
		Liquid::Template.register_tag 'seo', Liquid::Tag
		Liquid::Template.register_tag 'feed_meta', Liquid::Tag
		layout = Liquid::Template.parse layout_string
		index_html_path = File.join @www_home, 'index.html'
		parsed_index_html = FrontMatterParser::Parser.new(:md).call File.read index_html_path
		File.write index_html_path, layout.render('page' => parsed_index_html.front_matter, 'content' => parsed_index_html.content, 'jekyll' => {}, 'site' => {})

		log "Changing https://fastly.jsdelivr.net to /fastly.jsdelivr.net"
		Dir.glob File.join @www_home, '**/*' do |path|
			next if File.directory? path
			original = File.read path
			replaced = original.gsub 'https://fastly.jsdelivr.net', '/fastly.jsdelivr.net'
			if original != replaced
				logi "Changing #{path}"
				File.write path, replaced
			end
		end
	end

	def external_assets_for_www_home
		rmmv_corescripts_home = File.join @www_home, 'fastly.jsdelivr.net/gh/rpgtkoolmv/corescript@v1.3b'
		log "Cloning RPG Maker MV corescripts"
		system 'git', 'clone', *(@quiet ? ['--quiet'] : []), '--depth', '1', '--branch', 'v1.3b',
		       'https://github.com/rpgtkoolmv/corescript.git', rmmv_corescripts_home
		FileUtils.remove_dir File.join(rmmv_corescripts_home, '.git'), true
		
		log "Downloading other jsDelivr files"
		JSDELIVR_FILES.each { |path| download_remote 'fastly.jsdelivr.net', 'https://fastly.jsdelivr.net', path }

		log "Downloading audio assets from https://dododogame.github.io"
		AUDIO_ASSETS.each { |path| download_remote 'assets/audios', 'https://dododogame.github.io/assets/audios', path }
	end

	def setup_nwjs
		if File.exist? @nwjs_path
			log "Using #@nwjs_path"
		else
			remote_path = File.join "https://dl.nwjs.io/v#@nwjs_version", nwjs_filename
			log "Downloading #{remote_path} to #@nwjs_path"
			download_file @nwjs_path, remote_path
		end

		log "Extracting #@nwjs_path to #@temp_dir"
		extract @nwjs_path, @temp_dir

		source_path = File.join @temp_dir, nwjs_basename
		log "Copying files from #{source_path} to #@target_path"
		copy_files source_path, @target_path
	end

	def create_package_json
		package_json_path = File.join @www_home, 'package.json'
		log "Creating #{package_json_path}"
		File.write package_json_path, <<~'JSON'
			{
				"name": "Dododo",
				"main": "index.html",
				"js-flags": "--expose-gc",
				"chromium-args": "--disable-setuid-sandbox",
				"window": {
					"title": "Dododo",
					"toolbar": false,
					"width": 1024,
					"height": 768,
					"icon": "icon/icon.png"
				}
			}
		JSON
	end

	def package
		log "Packaging"
		if @platform == 'linux'
			File.open "#@target_path.tar.gz", 'wb' do |file|
				Zlib::GzipWriter.wrap file do |gzip|
					Gem::Package::TarWriter.new gzip do |tar|
						Dir.glob "#@target_path/**/*" do |path|
							next if File.directory? path
							relative_path = path.sub /^#@target_path\//, ''
							content = File.read path, mode: 'rb'
							tar.add_file_simple relative_path, File.stat(path).mode, content.length do |io|
								io.write content
							end
						end
					end
				end
			end
		else
			Zip::File.open "#@target_path.zip", create: true do |zip_file|
				Dir.glob "#@target_path/**/*" do |path|
					next if File.directory? path
					relative_path = path.sub /^#@target_path\//, ''
					zip_file.add relative_path, path
				end
			end
		end
	end

	def build
		log "Building Dododo for #@platform"
		raise "Platform not supported: #@platform-#@architecture" unless can_build?
		populate_www_home
		external_assets_for_www_home
		create_package_json
		unless @www_only
			setup_nwjs
			case @platform
			when 'win'
				build_win
			when 'osx'
				build_osx
			when 'linux'
				build_linux
			end
		end
		package if @package
		log "Completed"
	end

	def can_build?
		(@platform == 'win' || @platform == 'linux') && (@architecture == 'ia32' || @architecture == 'x64')
	end
	
	def build_win
		log "Writing launcher script"
		File.write File.join(@target_path, 'launcher.vbs'), <<~'VBS'
			Set oShell = CreateObject("Wscript.Shell")
			Dim strArgs
			strArgs = "nw www"
			oShell.Run strArgs, 0, false
		VBS
	end
	
	def build_osx
		raise "Not implemented"
	end
	
	def build_linux
		log "Writing launcher script"
		launcher_path = File.join @target_path, 'launcher.sh'
		File.write launcher_path, <<~'SH'
			#!/bin/sh
			BASEDIR=$(dirname "$0")
			$BASEDIR/nw $BASEDIR/www
		SH
		FileUtils.chmod '+x', launcher_path
	end
end

task :build do
	DododoBuilder.init
	DododoBuilder.build
end

task :clean do
	target_path = File.expand_path ENV['target_path'] || DododoBuilder::DEFAULT_TARGET_PATH
	FileUtils.remove_dir target_path, true
end

task default: :build
