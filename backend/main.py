import csv
import hashlib
import os
import sys
import json
import shutil
import exifread
from PIL import Image
from geopy.geocoders import Nominatim

def get_exif_data(file_path):
    with open(file_path, 'rb') as f:
        tags = exifread.process_file(f, details=False)
    return tags

def get_location(tags):
    geolocator = Nominatim(user_agent="sortwise")
    lat_ref = tags.get('GPS GPSLatitudeRef')
    lat = tags.get('GPS GPSLatitude')
    lon_ref = tags.get('GPS GPSLongitudeRef')
    lon = tags.get('GPS GPSLongitude')

    if not all([lat, lat_ref, lon, lon_ref]):
        return None

    def to_decimal(dms, ref):
        degrees = dms.values[0].num / dms.values[0].den
        minutes = dms.values[1].num / dms.values[1].den
        seconds = dms.values[2].num / dms.values[2].den
        decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
        if ref.values in ['S', 'W']:
            decimal *= -1
        return decimal

    latitude = to_decimal(lat, lat_ref)
    longitude = to_decimal(lon, lon_ref)

    location = geolocator.reverse((latitude, longitude), exactly_one=True)
    return location.raw['address']

def get_file_hash(file_path):
    hasher = hashlib.md5()
    with open(file_path, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def sort_files(options):
    folders = options.get('folders', [])
    sort_options = options.get('sortOptions', {})
    file_operation = options.get('fileOperation', 'move')
    conflict_resolution = options.get('conflictResolution', 'rename')
    hashes = set()
    log_file = os.path.join(os.path.expanduser("~"), "sortwise_log.csv")
    supported_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.mov', '.mp4', '.avi']

    with open(log_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Original Filename', 'Source Path', 'Destination Folder', 'Status'])

        all_files = []
        for folder in folders:
            for root, _, files in os.walk(folder):
                for file in files:
                    all_files.append(os.path.join(root, file))
        total_files = len(all_files)
        processed_files = 0

        for folder in folders:
            for root, _, files in os.walk(folder):
                for filename in files:
                    file_path = os.path.join(root, filename)
                    
                    processed_files += 1
                    progress = int((processed_files / total_files) * 100)
                    print(json.dumps({"type": "progress", "value": progress}))
                    sys.stdout.flush()

                    _, ext = os.path.splitext(filename)
                    if ext.lower() not in supported_extensions:
                        writer.writerow([filename, file_path, '', f'Skipped (Unsupported File Type: {ext})'])
                        continue

                    try:
                        if sort_options.get('deduplication'):
                            file_hash = get_file_hash(file_path)
                            if file_hash in hashes:
                                writer.writerow([filename, file_path, '', 'Skipped (Duplicate)'])
                                continue
                            hashes.add(file_hash)

                        target_subfolder = ''

                        if sort_options.get('fileType'):
                            file_type = filename.split('.')[-1].lower()
                            if 'screenshot' in filename.lower():
                                target_subfolder = os.path.join(target_subfolder, 'Screenshots')
                            elif file_type in ['jpg', 'jpeg', 'png', 'gif']:
                                target_subfolder = os.path.join(target_subfolder, 'Photos')
                            elif file_type in ['mov', 'mp4', 'avi']:
                                target_subfolder = os.path.join(target_subfolder, 'Videos')
                            elif file_type == 'gif':
                                target_subfolder = os.path.join(target_subfolder, 'GIFs')

                        tags = get_exif_data(file_path)

                        if sort_options.get('exifDate') and 'EXIF DateTimeOriginal' in tags:
                            date = str(tags['EXIF DateTimeOriginal'])
                            year = date.split(':')[0]
                            month = date.split(':')[1]
                            target_subfolder = os.path.join(target_subfolder, year, month)

                        if sort_options.get('cameraModel') and 'Image Model' in tags:
                            model = str(tags['Image Model']).replace(' ', '_')
                            target_subfolder = os.path.join(target_subfolder, model)

                        if sort_options.get('location'):
                            address = get_location(tags)
                            if address:
                                country = address.get('country', 'Unknown_Country')
                                city = address.get('city', 'Unknown_City')
                                target_subfolder = os.path.join(target_subfolder, country, city)

                        if sort_options.get('orientation'):
                            with Image.open(file_path) as img:
                                width, height = img.size
                                if width > height:
                                    orientation = 'Landscape'
                                else:
                                    orientation = 'Portrait'
                                target_subfolder = os.path.join(target_subfolder, orientation)

                        if sort_options.get('livePhotos'):
                            base, ext = os.path.splitext(filename)
                            if ext.lower() == '.jpg':
                                mov_file = os.path.join(root, base + '.mov')
                                if os.path.exists(mov_file):
                                    live_photo_folder = os.path.join(target_subfolder, 'Live_Photos')
                                    if not os.path.exists(os.path.join(folder, live_photo_folder)):
                                        os.makedirs(os.path.join(folder, live_photo_folder))
                                    
                                    # Move both files to the new target folder structure
                                    shutil.move(file_path, os.path.join(folder, live_photo_folder, filename))
                                    shutil.move(mov_file, os.path.join(folder, live_photo_folder, base + '.mov'))
                                    writer.writerow([filename, file_path, live_photo_folder, 'Moved'])
                                    writer.writerow([base + '.mov', mov_file, live_photo_folder, 'Moved'])
                                    continue

                        if target_subfolder:
                            # Create the full destination path
                            destination_folder = os.path.join(folder, target_subfolder)
                            if not os.path.exists(destination_folder):
                                os.makedirs(destination_folder)

                            destination_path = os.path.join(destination_folder, filename)

                            if os.path.exists(destination_path) and conflict_resolution == 'rename':
                                base, ext = os.path.splitext(filename)
                                i = 1
                                while os.path.exists(os.path.join(destination_folder, f'{base}_{i}{ext}')):
                                    i += 1
                                destination_path = os.path.join(destination_folder, f'{base}_{i}{ext}')

                            if file_operation == 'copy':
                                shutil.copy2(file_path, destination_path)
                                writer.writerow([filename, file_path, destination_folder, 'Copied'])
                            else:
                                shutil.move(file_path, destination_path)
                                writer.writerow([filename, file_path, destination_folder, 'Moved'])

                    except Exception as e:
                        writer.writerow([filename, file_path, '', f'Error: {e}'])
                        continue

    return {"status": "success", "message": "Files sorted successfully."}

def undo_sort(log_file):
    if not os.path.exists(log_file):
        return {"status": "error", "message": "Log file not found."}

    with open(log_file, 'r') as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header

        for row in reader:
            original_filename, source_path, destination_folder, status = row
            if status in ['Moved', 'Copied']:
                destination_path = os.path.join(destination_folder, original_filename)
                if os.path.exists(destination_path):
                    shutil.move(destination_path, source_path)

    return {"status": "success", "message": "Undo operation completed successfully."}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'undo':
            try:
                log_file_path = sys.argv[2]
                result = undo_sort(log_file_path)
                print(json.dumps(result))
            except Exception as e:
                print(json.dumps({"status": "error", "message": str(e)}))
        else:
            try:
                options = json.loads(sys.argv[1])
                result = sort_files(options)
                print(json.dumps(result))
            except json.JSONDecodeError:
                print(json.dumps({"status": "error", "message": "Invalid JSON input."}))
            except Exception as e:
                print(json.dumps({"status": "error", "message": str(e)}))
    else:
        print(json.dumps({"status": "error", "message": "No options provided."}))